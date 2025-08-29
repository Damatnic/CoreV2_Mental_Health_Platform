const fs = require('fs');
const path = require('path');

// Migration script for updating icon imports to use dynamic system
console.log('🔄 MIGRATING TO DYNAMIC ICON SYSTEM');
console.log('='.repeat(50));

// Find all TypeScript/TSX files in src
function findTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTsxFiles(fullPath, files);
    } else if ((item.endsWith('.tsx') || item.endsWith('.ts')) && !item.includes('icon')) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcFiles = findTsxFiles(path.join(__dirname, '../src'));
console.log(`Found ${srcFiles.length} files to check for icon imports`);

let totalUpdates = 0;
let filesUpdated = 0;

srcFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;
  let fileUpdated = false;

  // Pattern 1: import { IconName } from '../components/icons'
  const importPattern = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]*\/icons)['"];?/g;
  let match;
  
  while ((match = importPattern.exec(content)) !== null) {
    const icons = match[1];
    const importPath = match[2];
    
    // Update import path to dynamic icons
    const newImportPath = importPath.replace(/\/icons$/, '/icons.dynamic');
    const newImport = `import { ${icons} } from '${newImportPath}';`;
    
    updatedContent = updatedContent.replace(match[0], newImport);
    totalUpdates++;
    fileUpdated = true;
    
    console.log(`  ✓ Updated import in ${path.relative(process.cwd(), filePath)}`);
  }

  // Pattern 2: import * as Icons from '../components/icons'
  const namespacePattern = /import\s*\*\s*as\s*(\w+)\s*from\s*['"]([^'"]*\/icons)['"];?/g;
  
  while ((match = namespacePattern.exec(content)) !== null) {
    const namespace = match[1];
    const importPath = match[2];
    
    const newImportPath = importPath.replace(/\/icons$/, '/icons.dynamic');
    const newImport = `import * as ${namespace} from '${newImportPath}';`;
    
    updatedContent = updatedContent.replace(match[0], newImport);
    totalUpdates++;
    fileUpdated = true;
    
    console.log(`  ✓ Updated namespace import in ${path.relative(process.cwd(), filePath)}`);
  }

  // Write back if updated
  if (fileUpdated) {
    fs.writeFileSync(filePath, updatedContent);
    filesUpdated++;
  }
});

console.log(`\n📊 MIGRATION SUMMARY:`);
console.log(`  Files updated: ${filesUpdated}`);
console.log(`  Total import updates: ${totalUpdates}`);

// Create backup of original icons file
const originalIconsPath = path.join(__dirname, '../src/components/icons.tsx');
const backupPath = path.join(__dirname, '../src/components/icons.original.tsx');

if (fs.existsSync(originalIconsPath) && !fs.existsSync(backupPath)) {
  fs.copyFileSync(originalIconsPath, backupPath);
  console.log(`  ✓ Created backup: icons.original.tsx`);
}

// Replace original icons with dynamic version
const dynamicIconsPath = path.join(__dirname, '../src/components/icons.dynamic.tsx');
if (fs.existsSync(dynamicIconsPath)) {
  // Create a final optimized version with both immediate and lazy loading
  fs.copyFileSync(dynamicIconsPath, originalIconsPath);
  console.log(`  ✓ Replaced icons.tsx with dynamic version`);
}

console.log('\n🧪 TESTING STEPS:');
console.log('1. Run npm run build to test bundle size');
console.log('2. Run npm test to verify all tests pass');
console.log('3. Check that all icons render correctly');
console.log('4. Verify lazy loading works for rarely used icons');

console.log('\n🔧 ROLLBACK INSTRUCTIONS:');
console.log('If issues occur:');
console.log('1. Restore original: cp icons.original.tsx icons.tsx');
console.log('2. Update imports back to: from "...icons"');
console.log('3. Delete icons.dynamic.tsx and icons.optimized.tsx');
