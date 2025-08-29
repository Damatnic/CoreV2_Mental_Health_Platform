# Accessibility Quick Reference Card

## 🎨 WCAG AA Color System Quick Reference

### Use These Color Variables
```css
/* ✅ ALWAYS USE - WCAG AA Compliant */
--text-primary          /* 16.75:1 light, 15.8:1 dark */
--text-secondary        /* 7.54:1 light, 11.58:1 dark */
--text-tertiary         /* 4.66:1 light, 6.66:1 dark */
--accent-primary        /* 5.14:1 light, 6.94:1 dark */
--accent-danger         /* 5.94:1 light, 5.74:1 dark */
--accent-success        /* 4.52:1 light, 6.8:1 dark */
--accent-warning        /* 4.58:1 light, 8.59:1 dark */
```

### ❌ Never Use Hardcoded Colors
```css
/* ❌ NEVER USE */
color: #666;           /* Unknown contrast ratio */
background: white;     /* Context-dependent */
border: 1px solid red; /* May not meet contrast requirements */
```

---

## ⌨️ Focus Management Checklist

### Required Focus Indicators
```css
/* ✅ Always implement visible focus */
.interactive-element:focus-visible {
  outline: 3px solid var(--focus-outline-color);
  outline-offset: 2px;
}
```

### Focus Management Patterns
```javascript
// ✅ Modal focus management
class AccessibleModal {
  open() {
    this.previousFocus = document.activeElement;
    this.modal.focus();
    this.trapFocus();
  }
  
  close() {
    this.previousFocus?.focus();
  }
}
```

---

## 📝 Form Accessibility Requirements

### Required ARIA Attributes
```html
<!-- ✅ Accessible form pattern -->
<div class="form-group">
  <label for="input-id" class="form-label required">
    Field Label
  </label>
  <input 
    id="input-id"
    aria-describedby="input-help input-error"
    aria-invalid="false"
    required
  >
  <div id="input-help">Help text</div>
  <div id="input-error" role="alert">Error message</div>
</div>
```

### Form Validation Pattern
```javascript
// ✅ Accessible validation
function validateField(field) {
  const isValid = checkValidation(field);
  
  field.setAttribute('aria-invalid', !isValid);
  
  const container = field.closest('.form-group');
  container.classList.toggle('error', !isValid);
  
  const errorElement = container.querySelector('[role="alert"]');
  errorElement.textContent = isValid ? '' : getErrorMessage(field);
}
```

---

## 📱 Mobile Accessibility Standards

### Touch Target Requirements
```css
/* ✅ Minimum touch targets */
.btn, .form-input, .nav-link {
  min-height: 44px;  /* iOS minimum */
  min-width: 44px;
}

/* ✅ Comfortable targets */
.btn-primary {
  min-height: 48px;  /* Recommended */
}

/* ✅ Large targets for primary actions */
.btn-cta {
  min-height: 56px;  /* Large targets */
}
```

### Mobile Font Sizes
```css
/* ✅ Prevent unwanted zoom */
.form-input,
.form-textarea,
.form-select {
  font-size: 16px !important;  /* iOS minimum */
}
```

---

## 🧪 Testing Quick Commands

### Automated Testing
```bash
# Run accessibility tests
npm run test:a11y

# Check color contrast
npm run check:contrast

# Audit with axe-core
npm run audit:accessibility
```

### Manual Testing Checklist
```
□ Tab through entire interface
□ Test with screen reader (NVDA/VoiceOver)
□ Verify high contrast mode
□ Check keyboard-only navigation
□ Test mobile touch targets
□ Validate color contrast
```

---

## 🚫 Common Mistakes to Avoid

### ❌ Don't Do This
```css
/* ❌ Hardcoded colors */
.error { color: red; }

/* ❌ Insufficient contrast */
.subtle-text { color: #999; }

/* ❌ Small touch targets */
.mobile-btn { height: 32px; }

/* ❌ No focus indicator */
.btn:focus { outline: none; }
```

### ❌ Don't Do This (HTML)
```html
<!-- ❌ Missing labels -->
<input type="email" placeholder="Email">

<!-- ❌ Inaccessible error messages -->
<span class="error">Invalid email</span>

<!-- ❌ Missing ARIA attributes -->
<input type="password" required>
```

### ❌ Don't Do This (JavaScript)
```javascript
// ❌ Breaking keyboard navigation
element.addEventListener('click', handler);  // Add keydown too!

// ❌ Not managing focus
modal.style.display = 'block';  // Move focus to modal!

// ❌ Not announcing changes
updateContent();  // Use ARIA live regions!
```

---

## ✅ Quick Implementation Patterns

### Accessible Button
```html
<button 
  type="button"
  class="btn btn-primary"
  aria-describedby="btn-help"
>
  Submit Form
</button>
<div id="btn-help" class="sr-only">
  This will submit your form data
</div>
```

### Accessible Link
```html
<a 
  href="/dashboard" 
  class="nav-link"
  aria-current="page"
>
  Dashboard
  <span class="sr-only">(current page)</span>
</a>
```

### Accessible Icon Button
```html
<button 
  type="button" 
  class="btn btn-icon"
  aria-label="Close dialog"
>
  <svg aria-hidden="true">...</svg>
</button>
```

### Accessible Form Section
```html
<fieldset class="form-section">
  <legend class="form-section-title">
    Personal Information
  </legend>
  <!-- Form fields here -->
</fieldset>
```

---

## 🎯 CSS Classes Reference

### Pre-built Accessible Classes
```css
/* Screen reader only content */
.sr-only { /* Visually hidden but available to screen readers */ }

/* Focus management */
.focus-trap { /* Container for focus trapping */ }

/* Form states */
.form-group.error { /* Error state styling */ }
.form-group.success { /* Success state styling */ }

/* Touch targets */
.touch-target { /* Minimum 44px touch target */ }
.touch-target-large { /* 56px touch target */ }

/* High contrast support */
.high-contrast-border { /* Enhanced borders for high contrast */ }
```

---

## 📞 Emergency Contacts

### When You Need Help
- **Accessibility Expert**: Internal accessibility champion
- **Code Review**: Senior developer for accessibility review
- **Testing Support**: QA team for accessibility testing
- **Documentation**: Technical writer for accessibility docs

### External Resources
- **WebAIM**: Color contrast checker and guidelines
- **W3C WCAG**: Official accessibility guidelines
- **axe-core**: Browser extension for testing
- **NVDA**: Free screen reader for testing

---

## 🚀 Before You Ship Checklist

### Code Review
```
□ All colors use CSS variables
□ Focus indicators visible on all interactive elements
□ Form fields have proper labels and ARIA attributes
□ Touch targets meet 44px minimum
□ No hardcoded accessibility values
```

### Testing
```
□ Automated accessibility tests pass
□ Manual keyboard navigation works
□ Screen reader testing completed
□ High contrast mode verified
□ Mobile accessibility confirmed
```

### Documentation
```
□ New components documented
□ ARIA patterns explained
□ Color choices documented with contrast ratios
□ Testing procedures updated
```

---

**Keep this card handy during development!**  
*Last Updated: August 4, 2025*
