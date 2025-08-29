const fs = require('fs');
const path = require('path');

// Extract icon names from icons.tsx
const iconsFile = fs.readFileSync(path.join(__dirname, '../src/components/icons.tsx'), 'utf8');
const iconExports = iconsFile.match(/export const (\w+Icon)/g) || [];
const allIcons = iconExports.map(exp => exp.replace('export const ', ''));

console.log(`Total icons in icons.tsx: ${allIcons.length}`);

// Recursively find all .tsx and .ts files in src
function findFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findFiles(fullPath, files);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcFiles = findFiles(path.join(__dirname, '../src'));
console.log(`Scanning ${srcFiles.length} source files...`);

// Track which icons are used
const usedIcons = new Set();
const unusedIcons = new Set(allIcons);

// Scan each file for icon usage
srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Skip the icons.tsx file itself
  if (file.endsWith('icons.tsx')) return;
  
  allIcons.forEach(icon => {
    // Look for icon usage patterns
    const patterns = [
      new RegExp(`<${icon}\\s*[/>]`, 'g'),
      new RegExp(`{\\s*<${icon}\\s*[/>]`, 'g'),
      new RegExp(`icon={\\s*<${icon}\\s*[/>]`, 'g'),
      new RegExp(`icon:\\s*<${icon}\\s*[/>]`, 'g'),
      new RegExp(`\\b${icon}\\b`, 'g')
    ];
    
    if (patterns.some(pattern => pattern.test(content))) {
      usedIcons.add(icon);
      unusedIcons.delete(icon);
    }
  });
});

console.log('\n📊 ICON USAGE ANALYSIS');
console.log('='.repeat(50));
console.log(`✅ Used icons: ${usedIcons.size}/${allIcons.length} (${Math.round(usedIcons.size/allIcons.length*100)}%)`);
console.log(`❌ Unused icons: ${unusedIcons.size}/${allIcons.length} (${Math.round(unusedIcons.size/allIcons.length*100)}%)`);

console.log('\n🎯 USED ICONS:');
Array.from(usedIcons).sort().forEach(icon => console.log(`  ✓ ${icon}`));

console.log('\n🗑️  UNUSED ICONS:');
Array.from(unusedIcons).sort().forEach(icon => console.log(`  ✗ ${icon}`));

// Calculate potential savings
const avgIconSize = 60; // estimated bytes per icon
const potentialSavings = unusedIcons.size * avgIconSize;

console.log('\n💾 OPTIMIZATION POTENTIAL:');
console.log(`  Unused icons: ${unusedIcons.size}`);
console.log(`  Estimated savings: ~${potentialSavings} bytes (${(potentialSavings/1024).toFixed(1)} KB)`);
console.log(`  Bundle reduction: ~${Math.round(unusedIcons.size/allIcons.length*100)}%`);

// Generate optimized icons file content
console.log('\n🚀 GENERATING OPTIMIZED ICONS...');

const optimizedContent = `// Auto-generated optimized icons file
// Contains only used icons (${usedIcons.size}/${allIcons.length})
import React from 'react';

interface IconProps {
  path: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

const Icon: React.FC<IconProps> = ({ path, className, size = 24, style }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d={path} />
  </svg>
);

// Make all icon components accept size and className props
const createIcon = (path: string) => (props: { size?: number; className?: string; style?: React.CSSProperties } = {}) => 
  <Icon path={path} {...props} />;

// Used Icons (${usedIcons.size} total)
${Array.from(usedIcons).sort().map(icon => {
  // Extract the path from the original file
  const iconRegex = new RegExp(`export const ${icon} = createIcon\\(['"]([^'"]+)['"]\\)`);
  const match = iconsFile.match(iconRegex);
  if (match) {
    return `export const ${icon} = createIcon('${match[1]}');`;
  }
  return `// ${icon} - path not found`;
}).join('\n')}

export { Icon };
`;

// Write optimized file
fs.writeFileSync(
  path.join(__dirname, '../src/components/icons.optimized.tsx'),
  optimizedContent
);

console.log('✅ Generated: src/components/icons.optimized.tsx');
console.log('\n🔧 Next steps:');
console.log('1. Review the optimized file');
console.log('2. Replace imports in your components');
console.log('3. Test thoroughly');
console.log('4. Replace original icons.tsx when ready');
