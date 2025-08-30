#!/usr/bin/env node

/**
 * Fix Netlify Functions ES Module Syntax
 * Converts CommonJS to ES Modules for better compatibility
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const functionsPath = path.join(projectRoot, 'netlify', 'functions');

console.log('\n🔧 Fixing Netlify Functions ES Module Syntax...\n');

// Functions to convert
const functions = [
  'auth.js',
  'api.js',
  'health.js',
  'settings.js',
  'wellness.js',
  'assessments.js'
];

// Conversion rules
const conversions = [
  // Convert require to import
  { 
    pattern: /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    replacement: 'import $1 from \'$2\';'
  },
  { 
    pattern: /const\s+\{([^}]+)\}\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    replacement: 'import { $1 } from \'$2\';'
  },
  // Convert exports.handler to export const handler
  {
    pattern: /exports\.handler\s*=\s*async/g,
    replacement: 'export const handler = async'
  },
  // Convert module.exports to export default
  {
    pattern: /module\.exports\s*=\s*/g,
    replacement: 'export default '
  }
];

// Process each function file
let successCount = 0;
let errorCount = 0;

for (const functionFile of functions) {
  const filePath = path.join(functionsPath, functionFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${functionFile} not found, skipping...`);
    continue;
  }
  
  try {
    console.log(`📝 Processing ${functionFile}...`);
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Apply conversions
    let changesMade = false;
    for (const conversion of conversions) {
      const newContent = content.replace(conversion.pattern, conversion.replacement);
      if (newContent !== content) {
        changesMade = true;
        content = newContent;
      }
    }
    
    // Additional manual fixes for specific patterns
    // Fix any remaining require statements that might have different formats
    content = content.replace(/require\(/g, (match, offset) => {
      // Check if it's already been converted or is in a comment
      const lineStart = content.lastIndexOf('\n', offset);
      const lineEnd = content.indexOf('\n', offset);
      const line = content.substring(lineStart, lineEnd);
      
      if (line.includes('//') && line.indexOf('//') < offset - lineStart) {
        return match; // It's in a comment, don't change
      }
      
      console.log(`   ⚠️  Found unconverted require() at offset ${offset}`);
      return match; // Keep as is for manual review
    });
    
    if (changesMade) {
      // Create backup
      const backupPath = filePath + '.backup';
      fs.writeFileSync(backupPath, originalContent);
      
      // Write updated content
      fs.writeFileSync(filePath, content);
      console.log(`   ✅ Fixed ${functionFile} (backup saved as ${functionFile}.backup)`);
      successCount++;
    } else {
      console.log(`   ℹ️  No changes needed for ${functionFile}`);
    }
    
  } catch (error) {
    console.error(`   ❌ Error processing ${functionFile}:`, error.message);
    errorCount++;
  }
}

// Update package.json to use ES modules
const packageJsonPath = path.join(functionsPath, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('\n📦 Updating functions package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    // Add type: module if not present
    if (packageJson.type !== 'module') {
      packageJson.type = 'module';
      
      // Update scripts if necessary
      if (packageJson.scripts) {
        Object.keys(packageJson.scripts).forEach(key => {
          // Update node commands to use ES module flags if needed
          if (packageJson.scripts[key].includes('node ') && !packageJson.scripts[key].includes('--experimental-modules')) {
            // Modern Node.js doesn't need the flag, but we'll leave scripts as is
          }
        });
      }
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('   ✅ Added "type": "module" to package.json');
    } else {
      console.log('   ℹ️  package.json already configured for ES modules');
    }
  } catch (error) {
    console.error('   ❌ Error updating package.json:', error.message);
  }
}

// Create a netlify.toml configuration if needed
const netlifyTomlPath = path.join(projectRoot, 'netlify.toml');
console.log('\n📄 Checking netlify.toml configuration...');

if (fs.existsSync(netlifyTomlPath)) {
  let tomlContent = fs.readFileSync(netlifyTomlPath, 'utf-8');
  
  // Check if functions configuration exists
  if (!tomlContent.includes('[functions]')) {
    tomlContent += `\n[functions]
  # Use ES modules for functions
  node_bundler = "esbuild"
  external_node_modules = ["sharp", "@neondatabase/serverless", "pg"]
`;
    fs.writeFileSync(netlifyTomlPath, tomlContent);
    console.log('   ✅ Updated netlify.toml with functions configuration');
  } else {
    console.log('   ℹ️  netlify.toml already has functions configuration');
  }
}

// Summary
console.log('\n========================================');
console.log('📊 Conversion Summary:');
console.log(`   ✅ Successfully converted: ${successCount} files`);
if (errorCount > 0) {
  console.log(`   ❌ Errors encountered: ${errorCount} files`);
}
console.log('========================================\n');

if (successCount > 0) {
  console.log('💡 Next steps:');
  console.log('   1. Review the converted files for any remaining issues');
  console.log('   2. Test the functions locally with: netlify dev');
  console.log('   3. Deploy to Netlify to verify everything works');
  console.log('\n📝 Backup files have been created with .backup extension');
}

process.exit(errorCount > 0 ? 1 : 0);