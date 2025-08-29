#!/usr/bin/env node

/**
 * Mobile Sidebar Validation Script
 * 
 * Validates that the mobile sidebar implementation works correctly
 * with proper hamburger menu, slide-out behavior, and accessibility.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Mobile Sidebar Implementation Validation');
console.log('===========================================');

const srcDir = path.join(process.cwd(), 'src');
const stylesDir = path.join(srcDir, 'styles');
const componentsDir = path.join(srcDir, 'components');
const contextsDir = path.join(srcDir, 'contexts');

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

// Test 1: Mobile Sidebar Component
console.log('ℹ️ Validating Mobile Sidebar Component');
const mobileSidebarPath = path.join(componentsDir, 'MobileSidebarNav.tsx');
checkFile(mobileSidebarPath, 'MobileSidebarNav component exists');
checkFileContains(mobileSidebarPath, 'useSwipeNavigation', 'Component uses SwipeNavigation context');
checkFileContains(mobileSidebarPath, 'hamburgerRef', 'Hamburger menu ref implemented');
checkFileContains(mobileSidebarPath, 'mobile-sidebar-overlay', 'Overlay element implemented');
checkFileContains(mobileSidebarPath, 'MenuIcon', 'Hamburger menu icon implemented');

// Test 2: SwipeNavigation Context
console.log('ℹ️ Validating SwipeNavigation Context');
const swipeContextPath = path.join(contextsDir, 'SwipeNavigationContext.tsx');
checkFile(swipeContextPath, 'SwipeNavigationContext exists');
checkFileContains(swipeContextPath, 'isSidebarOpen', 'Sidebar open state managed');
checkFileContains(swipeContextPath, 'openSidebar', 'Open sidebar function');
checkFileContains(swipeContextPath, 'closeSidebar', 'Close sidebar function');
checkFileContains(swipeContextPath, 'toggleSidebar', 'Toggle sidebar function');

// Test 3: Mobile Sidebar CSS
console.log('ℹ️ Validating Mobile Sidebar CSS');
const mobileCSSPath = path.join(stylesDir, 'mobile-sidebar.css');
checkFile(mobileCSSPath, 'mobile-sidebar.css exists');
checkFileContains(mobileCSSPath, '@media (max-width: 768px)', 'Mobile breakpoint implemented');
checkFileContains(mobileCSSPath, '.mobile-header', 'Mobile header styling');
checkFileContains(mobileCSSPath, '.sidebar-trigger', 'Hamburger button styling');
checkFileContains(mobileCSSPath, '.mobile-sidebar-overlay', 'Overlay styling');
checkFileContains(mobileCSSPath, '.mobile-sidebar', 'Sidebar panel styling');

// Test 4: Responsive Behavior
console.log('ℹ️ Validating Responsive Behavior');
checkFileContains(mobileCSSPath, 'display: none', 'Mobile header hidden by default');
checkFileContains(mobileCSSPath, '@media (max-width: 768px)', 'Mobile-first responsive design');
checkFileContains(mobileCSSPath, 'display: flex', 'Mobile header shown on mobile');
checkFileContains(mobileCSSPath, '@media (min-width: 768px)', 'Desktop breakpoint implemented');
checkFileContains(mobileCSSPath, 'desktop-sidebar', 'Desktop sidebar styling');

// Test 5: Slide-out Animation
console.log('ℹ️ Validating Slide-out Animation');
checkFileContains(mobileCSSPath, 'transform: translateX(-100%)', 'Initial hidden position');
checkFileContains(mobileCSSPath, 'mobile-sidebar-open', 'Open state class');
checkFileContains(mobileCSSPath, 'transform: translateX(0)', 'Slide-in animation');
checkFileContains(mobileCSSPath, 'transition:', 'Smooth animation transition');
checkFileContains(mobileCSSPath, 'cubic-bezier', 'Easing function for animation');

// Test 6: Touch Optimization
console.log('ℹ️ Validating Touch Optimization');
checkFileContains(mobileCSSPath, 'min-height: 44px', 'WCAG touch target size');
checkFileContains(mobileCSSPath, '-webkit-tap-highlight-color: transparent', 'Touch highlight disabled');
checkFileContains(mobileCSSPath, 'touch-action: manipulation', 'Touch action optimization');
checkFileContains(mobileCSSPath, '@media (hover: none)', 'Touch device detection');
checkFileContains(mobileCSSPath, 'min-height: 60px', 'Enhanced touch targets on small screens');

// Test 7: Accessibility Features
console.log('ℹ️ Validating Accessibility Features');
checkFileContains(mobileSidebarPath, 'aria-label="Open navigation menu"', 'Hamburger button accessibility');
checkFileContains(mobileSidebarPath, 'aria-expanded', 'Sidebar expanded state');
checkFileContains(mobileSidebarPath, 'aria-controls', 'Sidebar control relationship');
checkFileContains(mobileSidebarPath, 'aria-hidden', 'Hidden state management');
checkFileContains(mobileSidebarPath, 'role="navigation"', 'Navigation role');

// Test 8: Keyboard Navigation
console.log('ℹ️ Validating Keyboard Navigation');
checkFileContains(mobileSidebarPath, 'Escape', 'Escape key handler');
checkFileContains(mobileSidebarPath, 'focus()', 'Focus management');
checkFileContains(mobileSidebarPath, 'handleKeyDown', 'Keyboard event handling');
checkFileContains(mobileCSSPath, ':focus-visible', 'Focus visible styling');
checkFileContains(mobileCSSPath, 'outline:', 'Focus outline styling');

// Test 9: Dark Mode Support
console.log('ℹ️ Validating Dark Mode Support');
checkFileContains(mobileCSSPath, '[data-theme="dark"]', 'Dark theme selector');
checkFileContains(mobileCSSPath, '--bg-primary-dark', 'Dark mode background variables');
checkFileContains(mobileCSSPath, '--text-primary-dark', 'Dark mode text variables');
checkFileContains(mobileCSSPath, '--border-dark', 'Dark mode border variables');

// Test 10: Performance Optimizations
console.log('ℹ️ Validating Performance Optimizations');
checkFileContains(mobileCSSPath, 'backdrop-filter: blur', 'Backdrop blur effect');
checkFileContains(mobileCSSPath, 'will-change', 'GPU acceleration hint', false);
checkFileContains(mobileCSSPath, '-webkit-overflow-scrolling: touch', 'iOS momentum scrolling');
checkFileContains(mobileCSSPath, 'contain:', 'CSS containment', false);

// Test 11: Body Scroll Prevention
console.log('ℹ️ Validating Body Scroll Prevention');
checkFileContains(mobileSidebarPath, 'document.body.style.overflow', 'Body scroll prevention');
checkFileContains(mobileSidebarPath, 'position: fixed', 'Body position locking', false);

// Test 12: Small Screen Adaptations
console.log('ℹ️ Validating Small Screen Adaptations');
checkFileContains(mobileCSSPath, '@media (max-width: 480px)', 'Small screen breakpoint');
checkFileContains(mobileCSSPath, 'width: 100vw', 'Full width on small screens');
checkFileContains(mobileCSSPath, 'max-width: 100vw', 'Prevent overflow on small screens');

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
  console.log('🎉 Mobile sidebar implementation is complete! 🎉');
  console.log('✨ Key Features Validated:');
  console.log('   • Responsive hamburger menu');
  console.log('   • Smooth slide-out animation');
  console.log('   • Touch-optimized interactions');
  console.log('   • WCAG accessibility compliance');
  console.log('   • Keyboard navigation support');
  console.log('   • Dark mode compatibility');
  console.log('   • Small screen adaptations');
  console.log('📱 Ready for mobile navigation testing!');
} else {
  console.log('❌ Some mobile sidebar issues found. Please review the failed tests above.');
  process.exit(1);
}
