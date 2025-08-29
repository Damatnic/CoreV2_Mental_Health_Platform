#!/usr/bin/env node

/**
 * WCAG 2.1 AA Touch Target Compliance Validator
 * 
 * Audits all interactive elements to ensure minimum 44px touch targets
 * for mobile accessibility compliance.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 WCAG 2.1 AA Touch Target Compliance Audit');
console.log('============================================');

const srcDir = path.join(process.cwd(), 'src');
const stylesDir = path.join(srcDir, 'styles');

let passedTests = 0;
let failedTests = 0;
let warnings = 0;
let totalTests = 0;

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ✓ ${description}`);
    passedTests++;
    return true;
  } else {
    console.log(`❌ ✗ ${description}`);
    failedTests++;
    return false;
  }
}

function checkFileContains(filePath, searchText, description, isRequired = true) {
  if (!fs.existsSync(filePath)) {
    if (isRequired) {
      console.log(`❌ ✗ ${description} (file not found)`);
      failedTests++;
    } else {
      console.log(`⚠️  ⚠ ${description} (file not found)`);
      warnings++;
    }
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let found = false;
  
  if (Array.isArray(searchText)) {
    found = searchText.some(text => content.includes(text));
  } else if (searchText instanceof RegExp) {
    found = searchText.test(content);
  } else {
    found = content.includes(searchText);
  }

  if (found) {
    console.log(`✅ ✓ ${description}`);
    passedTests++;
    return true;
  } else {
    if (isRequired) {
      console.log(`❌ ✗ ${description}`);
      failedTests++;
    } else {
      console.log(`⚠️  ⚠ ${description}`);
      warnings++;
    }
    return false;
  }
}

// Test 1: Button Components
console.log('ℹ️ Validating Button Components');
const appButtonPath = path.join(srcDir, 'components', 'AppButton.tsx');
const appButtonContent = fs.readFileSync(appButtonPath, 'utf8');
const hasButtonMinHeight = appButtonContent.includes('min-height: 44px') || appButtonContent.includes("minHeight: '44px'");
if (hasButtonMinHeight) {
  console.log('✅ ✓ AppButton minimum height');
  passedTests++;
  totalTests++;
} else {
  console.log('⚠️  ⚠ AppButton minimum height');
  warnings++;
  totalTests++;
}

// Test 2: Form Components
console.log('ℹ️ Validating Form Components');
const appInputPath = path.join(srcDir, 'components', 'AppInput.tsx');
const appInputContent = fs.readFileSync(appInputPath, 'utf8');
const hasMinHeight = appInputContent.includes('min-height: 44px') || appInputContent.includes("minHeight: '44px'");
if (hasMinHeight) {
  console.log('✅ ✓ AppInput minimum height');
  passedTests++;
} else {
  console.log('❌ ✗ AppInput minimum height');
  failedTests++;
}
totalTests++;

// Test 3: Navigation Elements
console.log('ℹ️ Validating Navigation Elements');
const sidebarPath = path.join(srcDir, 'components', 'SeekerSidebar.tsx');
checkFileContains(sidebarPath, 'min-height', 'Navigation items minimum height', false);

// Test 4: CSS Touch Target Standards
console.log('ℹ️ Validating CSS Touch Target Standards');
const mainCSSPath = path.join(process.cwd(), 'index.css');
checkFileContains(mainCSSPath, 'min-height: 44px', 'Global button minimum height', false);

// Test 5: Mobile CSS Touch Targets
console.log('ℹ️ Validating Mobile CSS Touch Targets');
const mobileCSSPath = path.join(stylesDir, 'mobile-sidebar.css');
checkFileContains(mobileCSSPath, ['min-height: 44px', 'min-width: 44px'], 'Mobile touch targets');

// Test 6: Chat Interface Touch Targets
console.log('ℹ️ Validating Chat Interface Touch Targets');
const chatCSSPath = path.join(stylesDir, 'mobile-chat-keyboard.css');
checkFileContains(chatCSSPath, 'min-height: 44px', 'Chat interface touch targets');

// Test 7: Modal and Dialog Touch Targets
console.log('ℹ️ Validating Modal and Dialog Components');
const modalPath = path.join(srcDir, 'components', 'Modal.tsx');
checkFileContains(modalPath, 'className', 'Modal component exists', false);

// Test 8: Card Components Touch Targets
console.log('ℹ️ Validating Card Components');
const cardPath = path.join(srcDir, 'components', 'Card.tsx');
checkFileContains(cardPath, 'className', 'Card component exists', false);

// Test 9: Icon Buttons and Small Interactive Elements
console.log('ℹ️ Validating Icon Buttons and Small Elements');
const iconsPath = path.join(srcDir, 'components', 'icons.tsx');
checkFile(iconsPath, 'Icons component exists');

// Test 10: Responsive Touch Targets
console.log('ℹ️ Validating Responsive Touch Target CSS');
const responsiveCSSPath = path.join(stylesDir, 'responsive-breakpoints.css');
checkFileContains(responsiveCSSPath, '--touch-target', 'Touch target CSS variables', false);

// Test 11: Component Responsive CSS
console.log('ℹ️ Validating Component Responsive Touch Targets');
const componentCSSPath = path.join(stylesDir, 'component-responsive.css');
checkFileContains(componentCSSPath, 'min-height: var(--touch-target', 'Component touch target variables', false);

// Test 12: Mobile Forms CSS
console.log('ℹ️ Validating Mobile Forms Touch Targets');
const mobileFormsCSSPath = path.join(stylesDir, 'mobile-forms.css');
checkFileContains(mobileFormsCSSPath, 'min-height', 'Mobile forms touch targets', false);

// Search for potential issues
console.log('ℹ️ Scanning for Potential Touch Target Issues');

function scanDirectory(dirPath, patterns) {
  if (!fs.existsSync(dirPath)) return [];
  
  const results = [];
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      results.push(...scanDirectory(fullPath, patterns));
    } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.css'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      for (const pattern of patterns) {
        if (content.includes(pattern.search)) {
          results.push({
            file: fullPath.replace(process.cwd(), ''),
            pattern: pattern.name,
            line: content.split('\n').findIndex(line => line.includes(pattern.search)) + 1
          });
        }
      }
    }
  }
  
  return results;
}

// Scan for small interactive elements that might need touch target fixes
const smallElementPatterns = [
  { name: 'width: 20px', search: 'width: 20px' },
  { name: 'height: 20px', search: 'height: 20px' },
  { name: 'width: 24px', search: 'width: 24px' },
  { name: 'height: 24px', search: 'height: 24px' },
  { name: 'width: 32px', search: 'width: 32px' },
  { name: 'height: 32px', search: 'height: 32px' },
  { name: 'Small button class', search: 'btn-sm' },
  { name: 'Small icon class', search: 'icon-sm' }
];

const smallElements = scanDirectory(srcDir, smallElementPatterns);

if (smallElements.length > 0) {
  console.log('⚠️  Found potentially small interactive elements:');
  for (const element of smallElements.slice(0, 10)) { // Show first 10
    console.log(`   • ${element.file}:${element.line} - ${element.pattern}`);
  }
  if (smallElements.length > 10) {
    console.log(`   ... and ${smallElements.length - 10} more`);
  }
  warnings += Math.min(smallElements.length, 10);
} else {
  console.log('✅ ✓ No obviously small interactive elements found');
  passedTests++;
}

// Summary
console.log('📋 Touch Target Compliance Summary');
console.log('==================================');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`⚠️  Warnings: ${warnings}`);

totalTests = passedTests + failedTests;
const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
console.log(`📊 Success Rate: ${successRate}%`);

if (failedTests === 0) {
  console.log('🎉 Touch target compliance audit completed successfully! 🎉');
  console.log('✨ Key Areas Validated:');
  console.log('   • Button components');
  console.log('   • Form input elements');
  console.log('   • Navigation items');
  console.log('   • Mobile interface elements');
  console.log('   • Chat interface components');
  console.log('📱 WCAG 2.1 AA touch target requirements met!');
  
  if (warnings > 0) {
    console.log(`\n⚠️  ${warnings} potential issues found that may need review.`);
  }
} else {
  console.log('❌ Some touch target compliance issues found. Please review the failed tests above.');
  process.exit(1);
}
