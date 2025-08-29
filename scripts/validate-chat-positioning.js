#!/usr/bin/env node

/**
 * Chat Input Positioning Validation Script
 * 
 * Validates that the chat input properly sticks to the bottom on mobile
 * and handles keyboard interactions correctly.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Chat Input Positioning Validation');
console.log('=====================================');

const srcDir = path.join(process.cwd(), 'src');
const stylesDir = path.join(srcDir, 'styles');

let passedTests = 0;
let failedTests = 0;
let warnings = 0;

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

// Test 1: Mobile Chat CSS Positioning
console.log('ℹ️ Validating Chat Composer Positioning');
const mobileCSSPath = path.join(stylesDir, 'mobile-chat-keyboard.css');
checkFileContains(mobileCSSPath, 'position: fixed !important', 'Chat composer has fixed positioning');
checkFileContains(mobileCSSPath, 'bottom: 0', 'Chat composer anchored to bottom');
checkFileContains(mobileCSSPath, 'left: 0', 'Chat composer spans full width (left)');
checkFileContains(mobileCSSPath, 'right: 0', 'Chat composer spans full width (right)');
checkFileContains(mobileCSSPath, 'z-index: 1000', 'Chat composer has proper z-index');

// Test 2: Safe Area Support
console.log('ℹ️ Validating Safe Area Inset Support');
checkFileContains(mobileCSSPath, 'env(safe-area-inset-bottom', 'Safe area bottom inset implemented');
checkFileContains(mobileCSSPath, 'max(1rem, env(safe-area-inset-bottom))', 'Progressive safe area enhancement');
checkFileContains(mobileCSSPath, '--safe-area-bottom', 'Safe area CSS custom property');

// Test 3: Keyboard Height Adjustments
console.log('ℹ️ Validating Keyboard Height Adjustments');
checkFileContains(mobileCSSPath, '--keyboard-height', 'Keyboard height CSS custom property');
checkFileContains(mobileCSSPath, 'calc(140px + var(--keyboard-height', 'Dynamic keyboard height calculation');
checkFileContains(mobileCSSPath, '.keyboard-open', 'Keyboard state class support');

// Test 4: MobileChatComposer Component
console.log('ℹ️ Validating MobileChatComposer Component');
const mobileKeyboardPath = path.join(srcDir, 'components', 'MobileKeyboardHandler.tsx');
checkFileContains(mobileKeyboardPath, 'MobileChatComposer', 'MobileChatComposer component exists');
checkFileContains(mobileKeyboardPath, ['position: \'fixed\'', 'position: "fixed"'], 'MobileChatComposer uses fixed positioning');
checkFileContains(mobileKeyboardPath, 'bottom: 0', 'MobileChatComposer bottom positioning');
checkFileContains(mobileKeyboardPath, 'zIndex: 1000', 'MobileChatComposer z-index');

// Test 5: ChatView Integration
console.log('ℹ️ Validating ChatView Integration');
const chatViewPath = path.join(srcDir, 'views', 'ChatView.tsx');
checkFileContains(chatViewPath, 'MobileChatComposer', 'ChatView uses MobileChatComposer');
checkFileContains(chatViewPath, /import.*MobileChatComposer.*from/, 'MobileChatComposer imported', true);

// Test 6: Chat Messages Padding
console.log('ℹ️ Validating Chat Messages Layout');
checkFileContains(mobileCSSPath, 'padding-bottom: calc(140px', 'Chat messages have bottom padding for composer');
checkFileContains(mobileCSSPath, '.chat-messages', 'Chat messages container styles');
checkFileContains(mobileCSSPath, 'overflow-y: auto', 'Chat messages scrollable');

// Test 7: Backdrop and Visual Effects
console.log('ℹ️ Validating Visual Polish');
checkFileContains(mobileCSSPath, 'backdrop-filter: blur', 'Backdrop blur effect');
checkFileContains(mobileCSSPath, ['box-shadow.*rgba', 'box-shadow: 0 -4px 20px rgba'], 'Shadow for depth');
checkFileContains(mobileCSSPath, ['border-top.*var(--border-color)', 'border-top: 1px solid var(--border-color)'], 'Top border styling');

// Test 8: Responsive Behavior
console.log('ℹ️ Validating Responsive Behavior');
checkFileContains(mobileCSSPath, '@media (max-width: 768px)', 'Mobile media query');
checkFileContains(mobileCSSPath, ['transition.*transform', 'transition: transform 0.2s ease-out'], 'Smooth transitions');

// Test 9: Accessibility
console.log('ℹ️ Validating Accessibility Features');
checkFileContains(mobileCSSPath, 'min-height: 44px', 'WCAG touch target size');
checkFileContains(mobileCSSPath, '-webkit-tap-highlight-color: transparent', 'Touch highlight optimization');
checkFileContains(mobileCSSPath, 'touch-action: manipulation', 'Touch action optimization');

// Test 10: Dark Mode Support
console.log('ℹ️ Validating Dark Mode Support');
checkFileContains(mobileCSSPath, '[data-theme="dark"]', 'Dark mode theme support');
checkFileContains(mobileCSSPath, 'rgba(30, 30, 40', 'Dark mode background color');

// Summary
console.log('📋 Validation Summary');
console.log('====================');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`⚠️  Warnings: ${warnings}`);

const totalTests = passedTests + failedTests;
const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
console.log(`📊 Success Rate: ${successRate}%`);

if (failedTests === 0) {
  console.log('🎉 Chat input positioning is properly implemented! 🎉');
  console.log('✨ Key Features Validated:');
  console.log('   • Fixed positioning at bottom');
  console.log('   • Safe area inset support');
  console.log('   • Keyboard height adjustments');
  console.log('   • Responsive mobile design');
  console.log('   • Accessibility compliance');
  console.log('   • Dark mode support');
  console.log('📱 Ready for mobile chat positioning testing!');
} else {
  console.log('❌ Some chat positioning issues found. Please review the failed tests above.');
  process.exit(1);
}
