const fs = require('fs');

// Read the file
const filePath = 'src/main.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Count brackets
let openBraces = 0;
let openParens = 0;
let openBrackets = 0;
const lines = content.split('\n');

console.log('Analyzing brackets in', filePath);
console.log('=====================================');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Count brackets in this line
  let braceChange = 0;
  let parenChange = 0;
  let bracketChange = 0;
  
  for (const char of line) {
    switch (char) {
      case '{':
        openBraces++;
        braceChange++;
        break;
      case '}':
        openBraces--;
        braceChange--;
        break;
      case '(':
        openParens++;
        parenChange++;
        break;
      case ')':
        openParens--;
        parenChange--;
        break;
      case '[':
        openBrackets++;
        bracketChange++;
        break;
      case ']':
        openBrackets--;
        bracketChange--;
        break;
    }
  }
  
  // Show lines with significant bracket changes or imbalances
  if (Math.abs(braceChange) > 0 || Math.abs(parenChange) > 0 || openBraces < 0 || openParens < 0) {
    console.log(`Line ${lineNum}: {${braceChange >= 0 ? '+' : ''}${braceChange}} (${parenChange >= 0 ? '+' : ''}${parenChange}) | Total: {${openBraces}} (${openParens}) | ${line.trim()}`);
  }
  
  // Alert on negative counts (more closing than opening)
  if (openBraces < 0) {
    console.log(`  ⚠️  EXCESS CLOSING BRACE at line ${lineNum}`);
  }
  if (openParens < 0) {
    console.log(`  ⚠️  EXCESS CLOSING PAREN at line ${lineNum}`);
  }
}

console.log('=====================================');
console.log(`Final counts:`);
console.log(`  Braces: ${openBraces} (${openBraces > 0 ? 'MISSING ' + openBraces + ' closing' : openBraces < 0 ? 'EXCESS ' + Math.abs(openBraces) + ' closing' : 'BALANCED'})`);
console.log(`  Parentheses: ${openParens} (${openParens > 0 ? 'MISSING ' + openParens + ' closing' : openParens < 0 ? 'EXCESS ' + Math.abs(openParens) + ' closing' : 'BALANCED'})`);
console.log(`  Brackets: ${openBrackets} (${openBrackets > 0 ? 'MISSING ' + openBrackets + ' closing' : openBrackets < 0 ? 'EXCESS ' + Math.abs(openBrackets) + ' closing' : 'BALANCED'})`);


// Read the file
const filePath = 'src/main.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Count brackets
let openBraces = 0;
let openParens = 0;
let openBrackets = 0;
const lines = content.split('\n');

console.log('Analyzing brackets in', filePath);
console.log('=====================================');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Count brackets in this line
  let braceChange = 0;
  let parenChange = 0;
  let bracketChange = 0;
  
  for (const char of line) {
    switch (char) {
      case '{':
        openBraces++;
        braceChange++;
        break;
      case '}':
        openBraces--;
        braceChange--;
        break;
      case '(':
        openParens++;
        parenChange++;
        break;
      case ')':
        openParens--;
        parenChange--;
        break;
      case '[':
        openBrackets++;
        bracketChange++;
        break;
      case ']':
        openBrackets--;
        bracketChange--;
        break;
    }
  }
  
  // Show lines with significant bracket changes or imbalances
  if (Math.abs(braceChange) > 0 || Math.abs(parenChange) > 0 || openBraces < 0 || openParens < 0) {
    console.log(`Line ${lineNum}: {${braceChange >= 0 ? '+' : ''}${braceChange}} (${parenChange >= 0 ? '+' : ''}${parenChange}) | Total: {${openBraces}} (${openParens}) | ${line.trim()}`);
  }
  
  // Alert on negative counts (more closing than opening)
  if (openBraces < 0) {
    console.log(`  ⚠️  EXCESS CLOSING BRACE at line ${lineNum}`);
  }
  if (openParens < 0) {
    console.log(`  ⚠️  EXCESS CLOSING PAREN at line ${lineNum}`);
  }
}

console.log('=====================================');
console.log(`Final counts:`);
console.log(`  Braces: ${openBraces} (${openBraces > 0 ? 'MISSING ' + openBraces + ' closing' : openBraces < 0 ? 'EXCESS ' + Math.abs(openBraces) + ' closing' : 'BALANCED'})`);
console.log(`  Parentheses: ${openParens} (${openParens > 0 ? 'MISSING ' + openParens + ' closing' : openParens < 0 ? 'EXCESS ' + Math.abs(openParens) + ' closing' : 'BALANCED'})`);
console.log(`  Brackets: ${openBrackets} (${openBrackets > 0 ? 'MISSING ' + openBrackets + ' closing' : openBrackets < 0 ? 'EXCESS ' + Math.abs(openBrackets) + ' closing' : 'BALANCED'})`);





