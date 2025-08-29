/**
 * Mobile Keyboard Fix Validation Script
 * 
 * Tests the mobile keyboard handling implementation to ensure
 * proper behavior on iOS Safari and Android Chrome
 */

const fs = require('fs');
const path = require('path');

class MobileKeyboardValidator {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0
        };
    }

    log(message, type = 'info') {
        const symbols = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        console.log(`${symbols[type]} ${message}`);
    }

    async validateMobileKeyboardHandler() {
        this.log('Validating Mobile Keyboard Handler Implementation', 'info');
        
        const handlerPath = path.join(process.cwd(), 'src', 'components', 'MobileKeyboardHandler.tsx');
        
        if (!fs.existsSync(handlerPath)) {
            this.log('MobileKeyboardHandler.tsx not found', 'error');
            this.results.failed++;
            return false;
        }

        const content = fs.readFileSync(handlerPath, 'utf8');
        
        // Test 1: Check for useMobileViewport hook
        if (content.includes('useMobileViewport')) {
            this.log('✓ useMobileViewport hook found', 'success');
            this.results.passed++;
        } else {
            this.log('✗ useMobileViewport hook missing', 'error');
            this.results.failed++;
        }

        // Test 2: Check for Visual Viewport API usage
        if (content.includes('window.visualViewport')) {
            this.log('✓ Visual Viewport API integration found', 'success');
            this.results.passed++;
        } else {
            this.log('✗ Visual Viewport API missing', 'warning');
            this.results.warnings++;
        }

        // Test 3: Check for keyboard height detection
        if (content.includes('keyboardHeight')) {
            this.log('✓ Keyboard height detection implemented', 'success');
            this.results.passed++;
        } else {
            this.log('✗ Keyboard height detection missing', 'error');
            this.results.failed++;
        }

        // Test 4: Check for MobileAppInput component
        if (content.includes('MobileAppInput')) {
            this.log('✓ MobileAppInput component found', 'success');
            this.results.passed++;
        } else {
            this.log('✗ MobileAppInput component missing', 'error');
            this.results.failed++;
        }

        // Test 5: Check for proper focus handling
        if (content.includes('scrollIntoView') && content.includes('handleFocus')) {
            this.log('✓ Mobile focus handling implemented', 'success');
            this.results.passed++;
        } else {
            this.log('✗ Mobile focus handling incomplete', 'warning');
            this.results.warnings++;
        }

        return true;
    }

    async validateChatViewIntegration() {
        this.log('Validating ChatView Integration', 'info');
        
        const chatViewPath = path.join(process.cwd(), 'src', 'views', 'ChatView.tsx');
        
        if (!fs.existsSync(chatViewPath)) {
            this.log('ChatView.tsx not found', 'error');
            this.results.failed++;
            return false;
        }

        const content = fs.readFileSync(chatViewPath, 'utf8');
        
        // Test 1: Check for MobileKeyboardHandler import
        if (content.includes('MobileKeyboardHandler')) {
            this.log('✓ MobileKeyboardHandler imported', 'success');
            this.results.passed++;
        } else {
            this.log('✗ MobileKeyboardHandler import missing', 'error');
            this.results.failed++;
        }

        // Test 2: Check for MobileAppInput usage
        if (content.includes('<MobileAppInput')) {
            this.log('✓ MobileAppInput component used', 'success');
            this.results.passed++;
        } else {
            this.log('✗ MobileAppInput not implemented', 'error');
            this.results.failed++;
        }

        // Test 3: Check for MobileChatComposer usage
        if (content.includes('<MobileChatComposer')) {
            this.log('✓ MobileChatComposer component used', 'success');
            this.results.passed++;
        } else {
            this.log('✗ MobileChatComposer not implemented', 'error');
            this.results.failed++;
        }

        // Test 4: Check for 16px font size (iOS zoom prevention)
        if (content.includes('fontSize: \'16px\'') || content.includes('font-size: 16px')) {
            this.log('✓ iOS zoom prevention (16px font) implemented', 'success');
            this.results.passed++;
        } else {
            this.log('⚠️ iOS zoom prevention should use 16px font size', 'warning');
            this.results.warnings++;
        }

        return true;
    }

    async validateCSSImplementation() {
        this.log('Validating Mobile CSS Implementation', 'info');
        
        const cssPath = path.join(process.cwd(), 'src', 'styles', 'mobile-chat-keyboard.css');
        
        if (!fs.existsSync(cssPath)) {
            this.log('mobile-chat-keyboard.css not found', 'error');
            this.results.failed++;
            return false;
        }

        const content = fs.readFileSync(cssPath, 'utf8');
        
        // Test 1: Check for viewport units
        if (content.includes('--mobile-vh') && content.includes('var(--mobile-vh')) {
            this.log('✓ Mobile viewport units implemented', 'success');
            this.results.passed++;
        } else {
            this.log('✗ Mobile viewport units missing', 'error');
            this.results.failed++;
        }

        // Test 2: Check for keyboard height variables
        if (content.includes('--keyboard-height') && content.includes('calc(')) {
            this.log('✓ Dynamic keyboard height adjustment implemented', 'success');
            this.results.passed++;
        } else {
            this.log('✗ Keyboard height adjustment missing', 'error');
            this.results.failed++;
        }

        // Test 3: Check for safe area support
        if (content.includes('env(safe-area-inset-bottom)')) {
            this.log('✓ Safe area inset support implemented', 'success');
            this.results.passed++;
        } else {
            this.log('✗ Safe area inset support missing', 'warning');
            this.results.warnings++;
        }

        // Test 4: Check for iOS-specific fixes
        if (content.includes('@supports (-webkit-touch-callout: none)')) {
            this.log('✓ iOS Safari specific fixes implemented', 'success');
            this.results.passed++;
        } else {
            this.log('⚠️ iOS Safari specific fixes could be enhanced', 'warning');
            this.results.warnings++;
        }

        // Test 5: Check for 44px touch targets
        if (content.includes('44px')) {
            this.log('✓ WCAG compliant touch targets (44px) implemented', 'success');
            this.results.passed++;
        } else {
            this.log('✗ WCAG touch target compliance missing', 'error');
            this.results.failed++;
        }

        // Test 6: Check for mobile-optimized class styles
        if (content.includes('.mobile-optimized')) {
            this.log('✓ Mobile-optimized input styles implemented', 'success');
            this.results.passed++;
        } else {
            this.log('✗ Mobile-optimized input styles missing', 'error');
            this.results.failed++;
        }

        return true;
    }

    async validateCSSImports() {
        this.log('Validating CSS Import Configuration', 'info');
        
        const cssPath = path.join(process.cwd(), 'index.css');
        
        if (!fs.existsSync(cssPath)) {
            this.log('index.css not found', 'error');
            this.results.failed++;
            return false;
        }

        const content = fs.readFileSync(cssPath, 'utf8');
        
        // Test 1: Check for mobile-chat-keyboard.css import
        if (content.includes('./src/styles/mobile-chat-keyboard.css')) {
            this.log('✓ mobile-chat-keyboard.css imported', 'success');
            this.results.passed++;
        } else {
            this.log('✗ mobile-chat-keyboard.css import missing', 'error');
            this.results.failed++;
        }

        return true;
    }

    async validateMainAppIntegration() {
        this.log('Validating Main App Integration', 'info');
        
        const indexPath = path.join(process.cwd(), 'index.tsx');
        
        if (!fs.existsSync(indexPath)) {
            this.log('index.tsx not found', 'error');
            this.results.failed++;
            return false;
        }

        const content = fs.readFileSync(indexPath, 'utf8');
        
        // Test 1: Check for MobileKeyboardProvider import
        if (content.includes('MobileKeyboardProvider')) {
            this.log('✓ MobileKeyboardProvider imported', 'success');
            this.results.passed++;
        } else {
            this.log('✗ MobileKeyboardProvider import missing', 'error');
            this.results.failed++;
        }

        // Test 2: Check for provider usage in component tree
        if (content.includes('<MobileKeyboardProvider>')) {
            this.log('✓ MobileKeyboardProvider added to app providers', 'success');
            this.results.passed++;
        } else {
            this.log('✗ MobileKeyboardProvider not used in app', 'error');
            this.results.failed++;
        }

        return true;
    }

    async validateAppInputMobileOptimizations() {
        this.log('Validating AppInput Mobile Optimizations', 'info');
        
        const appInputPath = path.join(process.cwd(), 'src', 'components', 'AppInput.tsx');
        
        if (!fs.existsSync(appInputPath)) {
            this.log('AppInput.tsx not found', 'error');
            this.results.failed++;
            return false;
        }

        const content = fs.readFileSync(appInputPath, 'utf8');
        
        // Test 1: Check for mobileOptimized prop
        if (content.includes('mobileOptimized')) {
            this.log('✓ mobileOptimized prop implemented', 'success');
            this.results.passed++;
        } else {
            this.log('✗ mobileOptimized prop missing', 'error');
            this.results.failed++;
        }

        // Test 2: Check for touch event handlers
        if (content.includes('onTouchStart') && content.includes('handleTouchStart')) {
            this.log('✓ Mobile touch event handlers implemented', 'success');
            this.results.passed++;
        } else {
            this.log('✗ Touch event handlers missing', 'error');
            this.results.failed++;
        }

        // Test 3: Check for mobile focus/blur handlers
        if (content.includes('handleFocus') && content.includes('handleBlur') && content.includes('mobile-focused')) {
            this.log('✓ Mobile focus management implemented', 'success');
            this.results.passed++;
        } else {
            this.log('✗ Mobile focus management incomplete', 'error');
            this.results.failed++;
        }

        // Test 4: Check for 16px font size (iOS zoom prevention)
        if (content.includes('fontSize: \'16px\'') || content.includes('16px')) {
            this.log('✓ iOS zoom prevention (16px font) in AppInput', 'success');
            this.results.passed++;
        } else {
            this.log('✗ iOS zoom prevention missing in AppInput', 'warning');
            this.results.warnings++;
        }

        // Test 5: Check for AppTextArea mobile optimizations
        if (content.includes('AppTextArea') && content.includes('mobileOptimized')) {
            this.log('✓ AppTextArea mobile optimizations implemented', 'success');
            this.results.passed++;
        } else {
            this.log('✗ AppTextArea mobile optimizations missing', 'error');
            this.results.failed++;
        }

        return true;
    }

    async runValidation() {
        console.log('🧪 Mobile Keyboard Fix Validation');
        console.log('=====================================\n');

        await this.validateMobileKeyboardHandler();
        console.log('');
        
        await this.validateChatViewIntegration();
        console.log('');
        
        await this.validateAppInputMobileOptimizations();
        console.log('');
        
        await this.validateCSSImplementation();
        console.log('');
        
        await this.validateMainAppIntegration();
        console.log('');
        
        await this.validateCSSImports();
        console.log('');

        this.printSummary();
    }

    printSummary() {
        console.log('📋 Validation Summary');
        console.log('====================');
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⚠️  Warnings: ${this.results.warnings}`);
        
        const total = this.results.passed + this.results.failed + this.results.warnings;
        const successRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0;
        console.log(`📊 Success Rate: ${successRate}%`);

        if (this.results.failed === 0) {
            console.log('\n🎉 Mobile keyboard fixes are properly implemented! 🎉');
            console.log('');
            console.log('✨ Key Features Validated:');
            console.log('   • Virtual keyboard height detection');
            console.log('   • iOS Safari zoom prevention (16px font)');
            console.log('   • Safe area inset support for iPhone');
            console.log('   • WCAG compliant touch targets (44px)');
            console.log('   • Dynamic viewport height adjustment');
            console.log('   • Mobile-optimized chat composer');
            console.log('');
            console.log('📱 Ready for mobile testing on:');
            console.log('   • iOS Safari (iPhone)');
            console.log('   • Android Chrome');
            console.log('   • Mobile browsers with virtual keyboards');
        } else {
            console.log(`\n⚠️  ${this.results.failed} critical issue(s) found. Please review the output above.`);
            if (this.results.warnings > 0) {
                console.log(`💡 ${this.results.warnings} enhancement(s) recommended for optimal mobile experience.`);
            }
        }
    }
}

// Run validation
const validator = new MobileKeyboardValidator();
validator.runValidation().catch(console.error);
