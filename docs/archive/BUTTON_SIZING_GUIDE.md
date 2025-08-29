# Button Sizing Standardization Guide

## Overview
This guide documents the standardization of button sizes and spacing across the application to ensure consistent visual hierarchy, accessibility compliance, and improved user experience.

## Button Size System

### Available Sizes
- **`xs`** - Extra Small (32px min-height) - Dense UI areas only
- **`sm`** - Small (36px min-height) - Secondary actions  
- **`md`** - Medium (44px min-height) - **Default**, most actions
- **`lg`** - Large (52px min-height) - Primary CTAs
- **`xl`** - Extra Large (60px min-height) - Hero CTAs

### Mobile Touch Targets
All button sizes meet WCAG 2.1 AA requirements:
- Minimum 44px touch target on all devices
- Touch devices automatically increase smaller buttons
- Icon-only buttons maintain square aspect ratio

## Usage Guidelines

### 1. AppButton Component (Recommended)
```tsx
// Enhanced buttons (default)
<AppButton enhanced size="sm" variant="secondary">Cancel</AppButton>
<AppButton enhanced size="md" variant="primary">Submit</AppButton>
<AppButton enhanced size="lg" variant="primary">Get Started</AppButton>

// Icon-only buttons
<AppButton enhanced size="md" variant="ghost" iconOnly icon={<EditIcon />}>
  Edit
</AppButton>

// Legacy support
<AppButton enhanced={false} size="sm" variant="danger">Delete</AppButton>
```

### 2. CSS Classes (Direct styling)
```tsx
// Enhanced button classes
<button className="btn-enhanced primary lg">Large Primary</button>
<button className="btn-enhanced secondary sm">Small Secondary</button>

// Legacy button classes  
<button className="btn btn-primary btn-lg">Large Primary</button>
<button className="btn btn-secondary btn-sm">Small Secondary</button>
```

## Button Hierarchy & Usage

### Primary Actions (Call-to-Action)
```tsx
// Hero sections, main form submissions
<AppButton enhanced size="lg" variant="primary">Get Started</AppButton>
<AppButton enhanced size="xl" variant="primary">Sign Up Now</AppButton>
```

### Secondary Actions
```tsx
// Supporting actions, navigation
<AppButton enhanced size="md" variant="secondary">Cancel</AppButton>
<AppButton enhanced size="sm" variant="ghost">Learn More</AppButton>
```

### Destructive Actions
```tsx
// Delete, remove actions - usually smaller
<AppButton enhanced size="sm" variant="danger">Delete</AppButton>
<AppButton enhanced size="md" variant="danger">Remove Account</AppButton>
```

### Icon Actions
```tsx
// Toolbars, quick actions
<AppButton enhanced size="sm" variant="ghost" iconOnly icon={<EditIcon />}>
  Edit Post
</AppButton>
<AppButton enhanced size="md" variant="secondary" icon={<ShareIcon />}>
  Share
</AppButton>
```

## Migration Examples

### Before (Inconsistent)
```tsx
// Mixed sizing approaches
<AppButton variant="success" className="btn-sm">Accept</AppButton>
<button className="btn btn-primary" style={{padding: '8px 16px'}}>Submit</button>
<AppButton variant="secondary" size="sm" className="custom-padding">Cancel</AppButton>
```

### After (Standardized)
```tsx
// Consistent sizing through props and classes
<AppButton enhanced size="sm" variant="success">Accept</AppButton>
<AppButton enhanced size="md" variant="primary">Submit</AppButton>
<AppButton enhanced size="sm" variant="secondary">Cancel</AppButton>
```

## Button Groups & Spacing

### Form Actions
```tsx
<div className="form-actions">
  <AppButton enhanced size="sm" variant="secondary">Cancel</AppButton>
  <AppButton enhanced size="md" variant="primary">Save Changes</AppButton>
</div>
```

### Card Actions
```tsx
<div className="card-actions justify-end">
  <AppButton enhanced size="sm" variant="ghost">View</AppButton>
  <AppButton enhanced size="sm" variant="primary">Edit</AppButton>
</div>
```

### Toolbar Actions
```tsx
<div className="toolbar">
  <AppButton enhanced size="sm" variant="ghost" iconOnly icon={<BoldIcon />}>Bold</AppButton>
  <AppButton enhanced size="sm" variant="ghost" iconOnly icon={<ItalicIcon />}>Italic</AppButton>
  <AppButton enhanced size="sm" variant="ghost" iconOnly icon={<LinkIcon />}>Link</AppButton>
</div>
```

## Accessibility Features

### Focus Management
- Consistent focus indicators that scale with button size
- Proper outline thickness and offset for each size
- High contrast mode support

### Screen Reader Support
- Automatic aria-label for icon-only buttons
- Proper button labeling and descriptions
- Loading state announcements

### Touch Accessibility
- All buttons meet 44px minimum touch target
- Enhanced touch feedback with proper active states
- Touch-action: manipulation prevents double-tap zoom

## Performance Considerations

### CSS Loading Order
Button sizing CSS is loaded after enhanced-ui.css to ensure proper cascade:
```css
@import './src/styles/enhanced-ui.css';
@import './src/styles/button-sizing.css';
```

### Bundle Size
- Consolidated sizing system reduces CSS duplication
- Shared variables and mixins improve maintainability
- No JavaScript dependencies for basic sizing

## Component Updates Required

### High Priority
1. **PostCard.tsx** - Replace `className="btn-sm"` with `size="sm"`
2. **ChatView.tsx** - Standardize button group spacing
3. **WellnessView.tsx** - Consistent form action buttons
4. **Modal.tsx** - Proper modal action button sizing

### Medium Priority
1. **AdminDashboard.tsx** - Table action buttons
2. **PastSessions.tsx** - Session action buttons
3. **CrisisResources.tsx** - Resource link buttons

### CSS Classes to Replace
- `btn-sm` → `size="sm"` prop or `btn-enhanced sm` class
- `btn-lg` → `size="lg"` prop or `btn-enhanced lg` class
- Custom padding/sizing → Standard size variants

## Testing Checklist

### Visual Consistency
- [ ] All buttons in same context use same size
- [ ] Primary actions are larger than secondary actions
- [ ] Icon-only buttons maintain square aspect ratio
- [ ] Button groups have consistent spacing

### Accessibility
- [ ] All buttons meet 44px touch target minimum
- [ ] Focus indicators are clearly visible
- [ ] Screen readers properly announce button labels
- [ ] High contrast mode displays properly

### Mobile Experience
- [ ] Touch targets are comfortable on mobile devices
- [ ] Button groups stack properly on small screens
- [ ] No horizontal scrolling in button groups
- [ ] Touch feedback is immediate and clear

## CSS Variables Reference

```css
/* Button Spacing */
--space-1: 0.25rem;     /* 4px */
--space-2: 0.5rem;      /* 8px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */

/* Border Radius */
--radius-base: 0.375rem; /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */

/* Typography */
--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
--font-size-xl: 1.25rem;   /* 20px */
```

## Support & Migration

For questions about button sizing or migration assistance:
1. Review this guide and the button-sizing.css file
2. Check existing enhanced components for patterns
3. Test button accessibility with screen readers
4. Verify touch targets on mobile devices

---

**Last Updated:** Button sizing standardization implementation
**Next Review:** After component migration completion
